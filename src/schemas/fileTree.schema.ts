import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Shared } from '../apptray/Interfaces/shared';

export type FileTreeDocument = FileTree & Document;

@Schema()
export class FileTree {
  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  tree: string;
}

export const FileTreeSchema = SchemaFactory.createForClass(FileTree);

export interface FolderNode {
  folderName: string;
  files: FileNode[];
  folders: FolderNode[];
  metaData: {
    shared: Shared[];
  };
}

export interface FileNode {
  fileName: string;
  fileType: string;
  metaData: {
    shared: Shared[];
  };
}
