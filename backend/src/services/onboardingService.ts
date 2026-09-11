import { Types } from 'mongoose';
import { User } from '../models/User';
import { EmployeeOnboarding, IEmployeeOnboarding } from '../models/EmployeeOnboarding';
import { OnboardingDocument } from '../models/OnboardingDocument';
import { ApiError } from '../utils/ApiError';
import { createNotification } from './notificationService';
import { setEmployeeCompensation } from './payrollService';
import { findActiveAdmins, findActiveManagers } from '../utils/roleHelpers';

const userPopulateFields = 'fullName employeeId department designation email phone joiningDate';

export async function createOnboardingForEmployee(
  employeeId: string,
  proposedMonthlySalary = 0,
) {
  const existing = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (existing) {
    return existing;
  }

  return EmployeeOnboarding.create({
    employee: employeeId,
    proposedMonthlySalary,
    status: 'pending_documents',
  });
}

export async function getMyOnboarding(employeeId: string) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  const documents = await OnboardingDocument.find({ employee: employeeId }).sort({ createdAt: -1 });
  return { onboarding, documents };
}

export async function updateMyOnboardingDetails(
  employeeId: string,
  data: {
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
    panNumber?: string;
    employeeNotes?: string;
  },
) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  if (onboarding.status === 'approved') {
    throw ApiError.badRequest('Onboarding is already approved');
  }

  Object.assign(onboarding, data);
  await onboarding.save();
  return onboarding;
}

export async function addOnboardingDocument(
  employeeId: string,
  data: {
    category: string;
    title: string;
    fileUrl: string;
    originalName: string;
    mimeType: string;
  },
) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  if (onboarding.status === 'approved') {
    throw ApiError.badRequest('Onboarding is already approved');
  }

  const document = await OnboardingDocument.create({
    employee: employeeId,
    category: data.category,
    title: data.title,
    fileUrl: data.fileUrl,
    originalName: data.originalName,
    mimeType: data.mimeType,
    status: 'pending',
  });

  if (onboarding.status === 'rejected') {
    onboarding.status = 'pending_documents';
    await onboarding.save();
  }

  return document;
}

export async function submitOnboarding(employeeId: string) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  const documentCount = await OnboardingDocument.countDocuments({ employee: employeeId });
  if (documentCount < 1) {
    throw ApiError.badRequest('Upload at least one document before submitting');
  }

  onboarding.status = 'submitted';
  onboarding.submittedAt = new Date();
  await onboarding.save();

  const managers = await findActiveManagers();
  await Promise.all(
    managers.map(manager =>
      createNotification({
        recipient: manager._id,
        title: 'Onboarding submitted',
        message: 'An employee submitted onboarding documents for review.',
        type: 'onboarding',
        relatedId: onboarding._id as Types.ObjectId,
      }),
    ),
  );

  return onboarding;
}

export async function listOnboardingForReview(page = 1, limit = 50, status?: string) {
  const query: Record<string, unknown> = {};
  if (status) {
    query.status = status;
  } else {
    query.status = { $in: ['submitted', 'hr_review', 'pending_documents'] };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmployeeOnboarding.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employee', userPopulateFields)
      .populate('reviewedBy', 'fullName'),
    EmployeeOnboarding.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getOnboardingByEmployeeId(employeeId: string) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId })
    .populate('employee', userPopulateFields)
    .populate('reviewedBy', 'fullName');
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }
  const documents = await OnboardingDocument.find({ employee: employeeId }).sort({ createdAt: -1 });
  return { onboarding, documents };
}

export async function reviewOnboarding(
  reviewerId: string,
  employeeId: string,
  data: {
    status: 'approved' | 'rejected' | 'hr_review';
    approvedMonthlySalary?: number;
    hrNotes?: string;
  },
) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  onboarding.status = data.status;
  onboarding.hrNotes = data.hrNotes?.trim() || '';
  onboarding.reviewedBy = new Types.ObjectId(reviewerId);
  onboarding.reviewedAt = new Date();

  if (data.status === 'approved') {
    const salary = data.approvedMonthlySalary ?? onboarding.proposedMonthlySalary;
    if (!salary || salary <= 0) {
      throw ApiError.badRequest('Approved monthly salary is required');
    }
    onboarding.approvedMonthlySalary = salary;
    await setEmployeeCompensation(employeeId, reviewerId, salary, 'Approved during onboarding');
    await User.findByIdAndUpdate(employeeId, { status: 'active' });
  }

  await onboarding.save();

  await createNotification({
    recipient: employeeId,
    title: data.status === 'approved' ? 'Onboarding approved' : 'Onboarding update',
    message:
      data.status === 'approved'
        ? 'Your onboarding has been approved and salary is configured.'
        : data.status === 'rejected'
          ? `Your onboarding needs changes.${data.hrNotes ? ` Note: ${data.hrNotes}` : ''}`
          : 'HR is reviewing your onboarding documents.',
    type: 'onboarding',
    relatedId: onboarding._id as Types.ObjectId,
  });

  return onboarding;
}

export async function shareSalaryRosterWithAdmin(hrId: string) {
  const roster = await EmployeeOnboarding.find({
    status: 'approved',
    sharedWithAdmin: false,
  })
    .populate('employee', userPopulateFields)
    .sort({ updatedAt: -1 });

  if (!roster.length) {
    throw ApiError.badRequest('No approved onboarding records to share');
  }

  const now = new Date();
  await EmployeeOnboarding.updateMany(
    { _id: { $in: roster.map(item => item._id) } },
    { $set: { sharedWithAdmin: true, sharedWithAdminAt: now } },
  );

  const admins = await findActiveAdmins();
  const summaryLines = roster
    .map(item => {
      const employee = item.employee as unknown as {
        fullName: string;
        department: string;
      };
      return `${employee.fullName} (${employee.department}) - INR ${item.approvedMonthlySalary ?? item.proposedMonthlySalary}`;
    })
    .join('\n');

  await Promise.all(
    admins.map(admin =>
      createNotification({
        recipient: admin._id,
        title: 'Salary roster shared by HR',
        message: `HR shared ${roster.length} employee salary records.\n${summaryLines}`,
        type: 'onboarding',
        relatedId: new Types.ObjectId(hrId) as Types.ObjectId,
      }),
    ),
  );

  return roster.map(item => {
    const employee = item.employee as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      employeeId: string;
      department: string;
      designation: string;
    };
    return {
      employeeId: employee._id.toString(),
      fullName: employee.fullName,
      employeeCode: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      monthlySalary: item.approvedMonthlySalary ?? item.proposedMonthlySalary,
      sharedAt: now,
    };
  });
}

export async function getAdminSalaryRoster() {
  const items = await EmployeeOnboarding.find({
    status: 'approved',
    sharedWithAdmin: true,
  })
    .populate('employee', userPopulateFields)
    .sort({ sharedWithAdminAt: -1, updatedAt: -1 });

  return items.map(item => {
    const employee = item.employee as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      employeeId: string;
      department: string;
      designation: string;
    };
    return {
      employeeId: employee._id.toString(),
      fullName: employee.fullName,
      employeeCode: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      monthlySalary: item.approvedMonthlySalary ?? item.proposedMonthlySalary,
      sharedWithAdminAt: item.sharedWithAdminAt,
      reviewedAt: item.reviewedAt,
    };
  });
}

export async function updateOnboardingSalary(
  reviewerId: string,
  employeeId: string,
  monthlySalary: number,
  notes = '',
) {
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  onboarding.approvedMonthlySalary = monthlySalary;
  onboarding.proposedMonthlySalary = monthlySalary;
  await onboarding.save();

  if (onboarding.status === 'approved') {
    await setEmployeeCompensation(employeeId, reviewerId, monthlySalary, notes);
  }

  return onboarding;
}

export async function employeeNeedsOnboarding(employeeId: string): Promise<boolean> {
  const user = await User.findById(employeeId);
  if (!user || user.role !== 'employee') {
    return false;
  }
  const onboarding = await EmployeeOnboarding.findOne({ employee: employeeId });
  return Boolean(onboarding && onboarding.status !== 'approved');
}
