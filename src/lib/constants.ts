export const criterionIds = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] as const;
export type CriterionId = (typeof criterionIds)[number];
export const reportStatuses = ['not_reported', 'reported', 'acknowledged', 'removed', 'rejected', 'escalated'] as const;
