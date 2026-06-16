import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmComplaintDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  assessmentId: string;
}
