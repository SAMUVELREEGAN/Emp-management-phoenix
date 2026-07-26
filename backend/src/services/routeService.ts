import { Types } from 'mongoose';
import { RouteSession, IRouteSession } from '../models/RouteSession';
import { RoutePoint } from '../models/RoutePoint';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { LocationPayload } from '../types';
import { endOfDay, parseDateOnly, startOfDay } from '../utils/dateHelpers';

const employeePopulateFields = 'fullName employeeId department designation role';

interface RoutePointInput {
  latitude: number;
  longitude: number;
  address?: string;
  recordedAt?: string;
}

export const startRouteSession = async (
  employeeId: string,
  attendanceId: Types.ObjectId,
  date: Date,
  initialLocation?: LocationPayload,
) => {
  const existing = await RouteSession.findOne({ attendance: attendanceId });
  if (existing) {
    existing.isActive = true;
    existing.endedAt = undefined;
    if (initialLocation) {
      existing.lastLatitude = initialLocation.latitude;
      existing.lastLongitude = initialLocation.longitude;
      existing.lastAddress = initialLocation.address || '';
      existing.lastRecordedAt = new Date();
    }
    await existing.save();
    return existing;
  }

  const session = await RouteSession.create({
    employee: employeeId,
    attendance: attendanceId,
    date: startOfDay(date),
    isActive: true,
    startedAt: new Date(),
    lastLatitude: initialLocation?.latitude,
    lastLongitude: initialLocation?.longitude,
    lastAddress: initialLocation?.address || '',
    lastRecordedAt: initialLocation ? new Date() : undefined,
    pointCount: initialLocation ? 1 : 0,
  });

  if (initialLocation) {
    await RoutePoint.create({
      session: session._id,
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      address: initialLocation.address || '',
      recordedAt: new Date(),
      sequence: 1,
    });
  }

  return session;
};

export const endRouteSession = async (
  attendanceId: string,
  finalLocation?: LocationPayload,
) => {
  const session = await RouteSession.findOne({
    attendance: attendanceId,
    isActive: true,
  });

  if (!session) {
    return null;
  }

  if (finalLocation) {
    await appendRoutePoints(session._id.toString(), [finalLocation]);
    session.lastLatitude = finalLocation.latitude;
    session.lastLongitude = finalLocation.longitude;
    session.lastAddress = finalLocation.address || '';
    session.lastRecordedAt = new Date();
  }

  session.isActive = false;
  session.endedAt = new Date();
  await session.save();

  return session;
};

export const appendRoutePoints = async (
  sessionId: string,
  points: RoutePointInput[],
) => {
  const session = await RouteSession.findById(sessionId);
  if (!session) {
    throw ApiError.notFound('Route session not found');
  }

  if (!session.isActive) {
    throw ApiError.badRequest('Route session is not active');
  }

  if (!points.length) {
    return session;
  }

  const lastPoint = await RoutePoint.findOne({ session: session._id })
    .sort({ sequence: -1 })
    .select('sequence');

  let sequence = lastPoint?.sequence || 0;

  const docs = points.map((point) => {
    sequence += 1;
    return {
      session: session._id,
      latitude: point.latitude,
      longitude: point.longitude,
      address: point.address || '',
      recordedAt: point.recordedAt ? new Date(point.recordedAt) : new Date(),
      sequence,
    };
  });

  await RoutePoint.insertMany(docs);

  const last = docs[docs.length - 1];
  session.lastLatitude = last.latitude;
  session.lastLongitude = last.longitude;
  session.lastAddress = last.address;
  session.lastRecordedAt = last.recordedAt;
  session.pointCount += docs.length;
  await session.save();

  return session;
};

export const appendPointsForEmployee = async (
  employeeId: string,
  points: RoutePointInput[],
) => {
  const session = await RouteSession.findOne({
    employee: employeeId,
    isActive: true,
  }).sort({ startedAt: -1 });

  if (!session) {
    throw ApiError.notFound('No active route session. Check in first.');
  }

  return appendRoutePoints(session._id.toString(), points);
};

export const getLiveTracking = async () => {
  const sessions = await RouteSession.find({ isActive: true })
    .sort({ lastRecordedAt: -1 })
    .populate('employee', employeePopulateFields);

  return sessions.map((session) => ({
    sessionId: session._id,
    employee: session.employee,
    startedAt: session.startedAt,
    lastLatitude: session.lastLatitude,
    lastLongitude: session.lastLongitude,
    lastAddress: session.lastAddress,
    lastRecordedAt: session.lastRecordedAt,
    pointCount: session.pointCount,
  }));
};

export const getEmployeeTodayRoute = async (employeeId: string) => {
  const today = startOfDay();
  const session = await RouteSession.findOne({
    employee: employeeId,
    date: { $gte: today, $lte: endOfDay(today) },
  })
    .sort({ startedAt: -1 })
    .populate('employee', employeePopulateFields);

  if (!session) {
    return { session: null, points: [] };
  }

  const points = await RoutePoint.find({ session: session._id })
    .sort({ sequence: 1 })
    .select('latitude longitude address recordedAt sequence');

  return { session, points };
};

export const getRouteHistory = async (
  employeeId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;
  const query = { employee: employeeId, isActive: false };

  const [items, total] = await Promise.all([
    RouteSession.find(query)
      .sort({ date: -1, startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employee', employeePopulateFields),
    RouteSession.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getSessionRoute = async (sessionId: string) => {
  const session = await RouteSession.findById(sessionId).populate(
    'employee',
    employeePopulateFields,
  );

  if (!session) {
    throw ApiError.notFound('Route session not found');
  }

  const points = await RoutePoint.find({ session: session._id })
    .sort({ sequence: 1 })
    .select('latitude longitude address recordedAt sequence');

  return { session, points };
};

export const getMyActiveSession = async (employeeId: string) => {
  return RouteSession.findOne({ employee: employeeId, isActive: true }).sort({
    startedAt: -1,
  });
};

export const getEmployeeByIdForTrack = async (employeeId: string) => {
  const employee = await User.findOne({
    _id: employeeId,
    role: 'employee',
    status: 'active',
  }).select(employeePopulateFields);

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  return employee;
};

export const listTrackableEmployees = async () => {
  const employees = await User.find({
    role: 'employee',
    status: 'active',
  })
    .select(employeePopulateFields)
    .sort({ fullName: 1 });

  const activeSessions = await RouteSession.find({ isActive: true });
  const activeMap = new Map(
    activeSessions.map((session) => [session.employee.toString(), session]),
  );

  return employees.map((employee) => {
    const session = activeMap.get(employee._id.toString());
    return {
      employee,
      isLive: !!session,
      sessionId: session?._id,
      lastLatitude: session?.lastLatitude,
      lastLongitude: session?.lastLongitude,
      lastAddress: session?.lastAddress,
      lastRecordedAt: session?.lastRecordedAt,
      pointCount: session?.pointCount || 0,
    };
  });
};

export const getHistoryByDate = async (employeeId: string, dateInput: string) => {
  const date = parseDateOnly(dateInput);
  const session = await RouteSession.findOne({
    employee: employeeId,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
  }).populate('employee', employeePopulateFields);

  if (!session) {
    return { session: null, points: [] };
  }

  const points = await RoutePoint.find({ session: session._id }).sort({ sequence: 1 });

  return { session, points };
};
