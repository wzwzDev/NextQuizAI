import type {
  AdminQuizQuestionMetadataPort,
  ParsedAdminQuizQuestionMetadata,
} from "@/application/ports/admin/AdminQuizQuestionMetadataPort";
import { parseQuestionMetadata } from "@/server/core/quizQuestionMetadata";

export class AdminQuizQuestionMetadataAdapter
  implements AdminQuizQuestionMetadataPort
{
  parse(rawOptions: unknown): ParsedAdminQuizQuestionMetadata {
    return parseQuestionMetadata(rawOptions);
  }
}
