import { Body, Controller, Post } from '@nestjs/common';
import { QueryRequestDto, QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  search(@Body() dto: QueryRequestDto) {
    return this.queryService.search(dto);
  }
}
