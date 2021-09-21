import { Shared } from '../Interfaces/shared';

export interface UploadFileDTO {
  path: string;
  formData: {
    file_buffer: string;
    type: string;
  };
  metaData: {
    shared: Shared[];
  };
}
