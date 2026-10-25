export const activeStatuses = ["approved", "ongoing", "completed"];

export const recalculateProgress = (research) => {
  const milestones = research.milestones || [];
  research.progressPercentage = milestones.length
    ? (milestones.every((milestone) => milestone.status === "completed") ? 100 : Math.min(99,
      Math.round(milestones.filter((milestone) => milestone.status === "completed").length / milestones.length * 100)))
    : 0;
  // Changing completed work reopens the project; only a supervisor can complete it again.
  if (research.status === "completed" && research.progressPercentage < 100) {
    research.status = "ongoing";
    research.endDate = undefined;
  }
};

export const isWebUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};
