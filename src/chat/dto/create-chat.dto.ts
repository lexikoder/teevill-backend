import { IsMongoId, IsString, Length } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  sender: string;

  @IsMongoId()
  recipient: string;

  @IsString()
  @Length(1, 500)
  message: string;
}
