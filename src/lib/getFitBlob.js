import { FitEncoder } from 'gpx2fit';
import getCoursePointMessage from './getCoursePointMessage.js';

// Get blob
export default function getFitBlob(leg) {
  const encoder = new FitEncoder();
  const startDate = Date.now();
  let recordMessages = createRecordMessages(leg);

  writeFileIdMessage(encoder, startDate);
  writeStartTimer(encoder, recordMessages);
  writeRecordMessages(encoder, recordMessages);
  writeLapMessage(encoder, recordMessages);
  writeCoursePointMessages(encoder, leg, recordMessages);
  writeStopTimer(encoder, recordMessages);
  return encoder.createBlob();
}

function writeFileIdMessage(encoder, startDate) {
  encoder.writeFileId({
    type: 'course',
    time_created: startDate,
  });
}

// Create our record messages.
function createRecordMessages(leg, startDate) {
  let lastTimeStamp = new Date(startDate).getTime();
  let distance = 0;

  return leg.geometry.coordinates.map((m, i) => {
    lastTimeStamp += 10;
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
function distanceBetween2Points(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians
  const degToRad = (degrees) => {
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

function writeRecordMessages(encoder, recordMessages) {
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

function writeStartTimer(encoder, recordMessages) {
  encoder.writeEvent({
    timestamp: recordMessages[0].timeStamp,
    event: 'timer',
    event_time: 'start',
    event_group: 0,
  });
}

function writeStopTimer(encoder, recordMessages) {
  encoder.writeEvent({
    timestamp: recordMessages[recordMessages.length - 1].timeStamp,
    event: 'timer',
    event_time: 'stop_disable_all',
    event_group: 0,
  });
}

function writeLapMessage(encoder, recordMessages) {
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
function writeCoursePointMessages(encoder, leg, recordMessages) {
  // Get instructions from our leg.
  leg.instructions.forEach((i) => {
    // Use the first item in our interval to find our corresponding record message.
    encoder.writeMessage(
      'course_point',
      getCoursePointMessage(i, recordMessages[i.interval[0]]),
    );
  });
}
