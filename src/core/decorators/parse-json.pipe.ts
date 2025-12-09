import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJSONPipe implements PipeTransform<string, any> {
  constructor(private readonly options: { isArray?: boolean } = {}) {}

  transform(value: string, metadata: ArgumentMetadata): any {
    if (!value) {
      return this.options.isArray ? [] : null;
    }

    try {
      const parsed = JSON.parse(value);

      if (this.options.isArray && !Array.isArray(parsed)) {
        throw new BadRequestException('Value must be an array');
      }

      return parsed;
    } catch (error) {
      throw new BadRequestException(`Invalid JSON format: ${error.message}`);
    }
  }
}