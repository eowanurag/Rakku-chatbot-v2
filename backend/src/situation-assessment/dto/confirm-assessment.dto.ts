import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmAssessmentDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  assessmentId: string;
}
