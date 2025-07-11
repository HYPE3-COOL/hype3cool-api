import { Test, TestingModule } from '@nestjs/testing';
import { PrivyService } from './privy.service';

describe('PrivyService', () => {
  let service: PrivyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivyService],
    }).compile();

    service = module.get<PrivyService>(PrivyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
