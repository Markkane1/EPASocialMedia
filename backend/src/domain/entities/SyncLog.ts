export interface SyncLogProps {
  id?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'initialized';
  message: string;
  details?: Record<string, any>;
}

export class SyncLog {
  public readonly id?: string;
  public readonly timestamp: string;
  public readonly status: 'success' | 'warning' | 'error' | 'initialized';
  public readonly message: string;
  public readonly details?: Record<string, any>;

  constructor(props: SyncLogProps) {
    this.id = props.id;
    this.timestamp = props.timestamp || new Date().toISOString();
    this.status = props.status;
    this.message = props.message;
    this.details = props.details;
  }

  public toJSON() {
    return {
      timestamp: this.timestamp,
      status: this.status,
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}
