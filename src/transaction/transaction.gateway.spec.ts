import { Test, TestingModule } from '@nestjs/testing';
import { TransactionGateway } from './transaction.gateway';

describe('TransactionGateway', () => {
  let gateway: TransactionGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionGateway],
    }).compile();

    gateway = module.get<TransactionGateway>(TransactionGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
