import { IsString, IsNotEmpty } from 'class-validator';

export class AssessSituationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
