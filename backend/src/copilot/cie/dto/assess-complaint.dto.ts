import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class AssessComplaintDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  incidentType: string;

  @IsString()
  @IsOptional()
  @IsIn(['en', 'hi', 'hinglish'])
  language?: 'en' | 'hi' | 'hinglish';

  @IsString()
  @IsOptional()
  changeSummary?: string;
}
