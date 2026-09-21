import { IConfigRepository } from '../../domain/repositories/IConfigRepository';

export class ConfigUseCase {
  constructor(private readonly configRepo: IConfigRepository) {}

  public async getMaskedConfig(): Promise<Record<string, string>> {
    const config = await this.configRepo.getConfig();
    return config.getAllMasked();
  }

  public async updateConfig(updates: Record<string, string>): Promise<{ status: string; message: string }> {
    await this.configRepo.updateConfig(updates);
    return {
      status: 'success',
      message: 'Config updated successfully'
    };
  }
}
