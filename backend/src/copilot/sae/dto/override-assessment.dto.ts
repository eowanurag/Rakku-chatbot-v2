import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OverrideAssessmentDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @IsString()
  @IsNotEmpty()
  citizenSelectedIntent: string;

  @IsString()
  @IsOptional()
  citizenSelectedService?: string;
}
