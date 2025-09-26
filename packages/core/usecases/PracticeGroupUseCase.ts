import { PracticeGroupRepository } from "../../data/repositories/PracticeGroupRepository";

export async function getGroupsByOffering(offeringId: number) {
  const repo = new PracticeGroupRepository();
  return await repo.getGroupsByOffering(offeringId);
}


