import { PayrollPolicy, IPayrollPolicy } from '../models/PayrollPolicy';

export const getPayrollPolicy = async (): Promise<IPayrollPolicy> => {
  let policy = await PayrollPolicy.findOne();
  if (!policy) {
    policy = await PayrollPolicy.create({});
  }
  return policy;
};

export const updatePayrollPolicy = async (data: Partial<IPayrollPolicy>) => {
  const policy = await getPayrollPolicy();
  Object.assign(policy, data);
  await policy.save();
  return policy;
};
