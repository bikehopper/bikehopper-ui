import { FitEncoder } from 'gpx2fit';
import getCoursePointMessage from './getCoursePointMessage.js';

// Get blob
export default function getFitBlob(leg) {
  const encoder = new FitEncoder();
  const startDate = Date.now();
  let recordMessages = createRecordMessages(leg);

  writeFileIdMessage(encoder, startDate);
  calculateDistanceToPriorPointInMeters(recordMessages);
  startTimer(encoder, recordMessages);
  writeRecordMessages(encoder, recordMessages);
  writeLapMessage(encoder, recordMessages);
  writeCoursePointMessages(encoder, leg, recordMessages);
  stopTimer(encoder, recordMessages);
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
  return leg.geometry.coordinates.map((m) => {
    lastTimeStamp += 10;
    return {
      positionLong: m[0],
      positionLat: m[1],
      altitude: m[2],
      timeStamp: lastTimeStamp,
      localNum: 5,
    };
  });
}

// Calculate the great circle distance between two GPS points.
function distanceBetween2Points(lat1, lon1, lat2, lon2) {
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

// Compute distance for every record message and update the record.
function calculateDistanceToPriorPointInMeters(recordMessages) {
  let distance = 0;
  let currentRecord;
  let priorRecord;

  for (let i = 0; i < recordMessages.length; i++) {
    currentRecord = recordMessages[i];
    if (i > 0) {
      priorRecord = recordMessages[i - 1];
      distance += distanceBetween2Points(
        priorRecord.positionLat,
        priorRecord.positionLong,
        currentRecord.positionLat,
        currentRecord.positionLong,
      );
    }
    currentRecord.distance = distance;
  }
}

// Convert degrees to radians
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function startTimer(encoder, recordMessages) {
  encoder.writeEvent({
    timestamp: recordMessages[0].timeStamp,
    event: 'timer',
    event_time: 'start',
    event_group: 0,
  });
}

function stopTimer(encoder, recordMessages) {
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
