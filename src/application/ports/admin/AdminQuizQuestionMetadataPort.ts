export type AdminQuizCitation = {
  source: string;
  snippet: string;
  confidence?: number;
};

export type ParsedAdminQuizQuestionMetadata = {
  options: string[];
  citation?: AdminQuizCitation;
};

export interface AdminQuizQuestionMetadataPort {
  parse(rawOptions: unknown): ParsedAdminQuizQuestionMetadata;
}
