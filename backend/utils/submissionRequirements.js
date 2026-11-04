import Document from "../models/document.js";

export const missingDocuments = async (research, stage) => {
  const required = (research.requiredDocuments || []).filter((item) => item.stage === stage).map((item) => item.documentType);
  if (!required.length) return [];
  const submitted = await Document.distinct("documentType", {
    researchId: research._id, documentType: { $in: required },
    status: stage === "completion" ? "approved" : { $in: ["pending", "approved"] },
  });
  return required.filter((type) => !submitted.includes(type));
};
