import mongoose, { Schema, Document } from 'mongoose';

export type CheckInMethod = 'QR' | 'PIN';
export type CheckInResult = 'SUCCESS' | 'DENIED';

export interface IAttendanceLog extends Document {
  clientId: string;
  classId: string;
  method: CheckInMethod;
  result: CheckInResult;
  reason?: string;
  timestamp: Date;
  ip: string;
}

const AttendanceLogSchema = new Schema<IAttendanceLog>(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    classId: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['QR', 'PIN'],
      required: true,
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'DENIED'],
      required: true,
    },
    reason: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'attendance_logs',
  }
);

AttendanceLogSchema.index({ clientId: 1, timestamp: -1 });
AttendanceLogSchema.index({ classId: 1, timestamp: -1 });

export const AttendanceLog = mongoose.model<IAttendanceLog>(
  'AttendanceLog',
  AttendanceLogSchema
);
