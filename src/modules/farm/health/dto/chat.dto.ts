import { IsString, IsUUID, IsOptional, IsNotEmpty, MaxLength, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatPartDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'model';

  @ValidateNested({ each: true })
  @Type(() => ChatPartDto)
  @ArrayNotEmpty()
  parts: ChatPartDto[];
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsUUID()
  @IsNotEmpty()
  animalId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class ChatResponseDto {
  response: string;
  source?: 'rag' | 'fallback' | 'error';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  confidence?: number;
}
