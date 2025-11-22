import { Test, TestingModule } from '@nestjs/testing';
import { PrologService } from './prolog.service';

describe('PrologService', () => {
  let service: PrologService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrologService],
    }).compile();

    service = module.get<PrologService>(PrologService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
