import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CharacterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsNotEmpty()
  intro: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  lore: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  knowledge: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  topics: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  style: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  chat: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  posts: string;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  adjectives: string;

  @ApiProperty({ type: String, default: 'en' })
  @IsString()
  @IsOptional()
  language: string;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  withHashTags: boolean;
}

export class CreateAgentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ default: '' })
  @IsString()
  @IsOptional() // Making this optional based on your schema
  avatar: string; // URL of the generated profile picture

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string' },
      intro: { type: 'string', default: '' },
      bio: { type: 'string', default: '' },
      lore: { type: 'string', default: '' },
      knowledge: { type: 'string', default: '' },
      topics: { type: 'string', default: '' },
      style: { type: 'string', default: '' },
      chat: { type: 'string', default: '' },
      posts: { type: 'string', default: '' },
      adjectives: { type: 'string', default: '' },
      language: { type: 'string', default: 'en' },
      withHashTags: { type: 'boolean', default: false },
    },
    default: {
      name: '',
      intro: '',
      bio: '',
      lore: '',
      knowledge: '',
      topics: '',
      style: '',
      chat: '',
      posts: '',
      adjectives: '',
      language: 'en',
      withHashTags: false,
    },
  })
  @ValidateNested()
  @Type(() => CharacterDto)
  character: CharacterDto;

  @ApiProperty({ type: [Object], default: [] }) // Adjusted for suggestions
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  suggestions: Array<{
    id?: string;
    name?: string;
    username: string;
    avatar?: string;
  }>;
}
