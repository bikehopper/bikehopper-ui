import { FitEncoder } from 'gpx2fit';
import type { BikeLeg, RouteInstruction } from './BikeHopperClient';
import InstructionSigns from './InstructionSigns';

type FitMessage = {
  positionLong: number;
  positionLat: number;
  altitude: number;
  timeStamp: number;
  localNum: number;
  distance: number;
};

// Get blob
export default function getFitBlob(leg: BikeLeg) {
  const encoder = new FitEncoder();
  const startDate = Date.now();
  let recordMessages: FitMessage[] = createRecordMessages(leg, startDate);

  writeFileIdMessage(encoder, startDate);
  writeStartTimer(encoder, recordMessages);
  writeRecordMessages(encoder, recordMessages);
  writeLapMessage(encoder, recordMessages);
  writeCoursePointMessages(encoder, leg, recordMessages);
  writeStopTimer(encoder, recordMessages);
  return encoder.createBlob();
}

function writeFileIdMessage(encoder: FitEncoder, startDate: number) {
  encoder.writeFileId({
    type: 'course',
    time_created: startDate,
  });
}

// Create our record messages.
function createRecordMessages(leg: BikeLeg, startDate: number) {
  let lastTimeStamp = new Date(startDate).getTime();
  let distance = 0;

  return leg.geometry.coordinates.map((m, i) => {
    lastTimeStamp += 1000;
    distance +=
      i > 0
        ? distanceBetween2Points(
            leg.geometry.coordinates[i - 1][1],
            leg.geometry.coordinates[i - 1][0],
            m[1],
            m[0],
          )
        : 0;

    return {
      positionLong: m[0],
      positionLat: m[1],
      altitude: m[2],
      timeStamp: lastTimeStamp,
      localNum: 5,
      distance,
    };
  });
}

// Calculate the great circle distance between two GPS points.
function distanceBetween2Points(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Convert degrees to radians
  const degToRad = (degrees: number) => {
    return degrees * (Math.PI / 180);
  };

  const earthRadius = 6371000; // Meters
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function writeRecordMessages(
  encoder: FitEncoder,
  recordMessages: FitMessage[],
) {
  recordMessages.forEach((recordMessage) => {
    encoder.writeRecord({
      altitude: recordMessage.altitude,
      distance: recordMessage.distance,
      timestamp: recordMessage.timeStamp,
      position_lat: recordMessage.positionLat,
      position_long: recordMessage.positionLong,
    });
  });
}

function writeStartTimer(encoder: FitEncoder, recordMessages: FitMessage[]) {
  encoder.writeEvent({
    timestamp: recordMessages[0].timeStamp,
    event: 'timer',
    event_time: 'start',
    event_group: 0,
  });
}

function writeStopTimer(encoder: FitEncoder, recordMessages: FitMessage[]) {
  encoder.writeEvent({
    timestamp: recordMessages[recordMessages.length - 1].timeStamp,
    event: 'timer',
    event_time: 'stop_disable_all',
    event_group: 0,
  });
}

function writeLapMessage(encoder: FitEncoder, recordMessages: FitMessage[]) {
  const firstMessage = recordMessages[0];
  const lastMessage = recordMessages[recordMessages.length - 1];

  encoder.writeMessage('lap', {
    start_time: firstMessage.timeStamp,
    start_position_lat: firstMessage.positionLat,
    start_position_long: firstMessage.positionLong,
    end_position_lat: lastMessage.positionLat,
    end_position_long: lastMessage.positionLong,
    total_elapsed_time: lastMessage.timeStamp - firstMessage.timeStamp,
    total_time_time: lastMessage.timeStamp - firstMessage.timeStamp,
  });
}

// Write turn by turn.
function writeCoursePointMessages(
  encoder: FitEncoder,
  leg: BikeLeg,
  recordMessages: FitMessage[],
) {
  // Get instructions from our leg.
  leg.instructions.forEach((i) => {
    // Use the first item in our interval to find our corresponding record message.
    encoder.writeMessage(
      'course_point',
      getCoursePointMessage(i, recordMessages[i.interval[0]]),
    );
  });
}

function getCoursePointMessage(
  instruction: RouteInstruction,
  rMsg: FitMessage,
) {
  return {
    timestamp: rMsg.timeStamp,
    type: translateInstruction(instruction),
    name: instruction.text,
    position_lat: rMsg.positionLat,
    position_long: rMsg.positionLong,
    distance: rMsg.distance,
  };
}

// Convert BikeHopper instructions to FIT file instructions.
function translateInstruction(instruction: RouteInstruction): string {
  switch (instruction.sign) {
    case InstructionSigns.U_TURN_UNKNOWN:
      return 'u_turn';
    case InstructionSigns.U_TURN_LEFT:
      return 'u_turn';
    case InstructionSigns.KEEP_LEFT:
      return 'slight_left';
    case InstructionSigns.LEAVE_ROUNDABOUT:
      return 'generic';
    case InstructionSigns.TURN_SHARP_LEFT:
      return 'sharp_left';
    case InstructionSigns.TURN_LEFT:
      return 'left';
    case InstructionSigns.TURN_SLIGHT_LEFT:
      return 'slight_left';
    case InstructionSigns.CONTINUE_ON_STREET:
      return 'straight';
    case InstructionSigns.TURN_SLIGHT_RIGHT:
      return 'slight_right';
    case InstructionSigns.TURN_RIGHT:
      return 'right';
    case InstructionSigns.TURN_SHARP_RIGHT:
      return 'sharp_right';
    case InstructionSigns.FINISH:
      return 'generic';
    case InstructionSigns.REACHED_VIA:
      return 'generic';
    case InstructionSigns.USE_ROUNDABOUT:
      return 'generic';
    case InstructionSigns.KEEP_RIGHT:
      return 'slight_right';
    case InstructionSigns.U_TURN_RIGHT:
      return 'u_turn';
    default:
      return 'generic';
  }
}
