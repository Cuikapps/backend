/*
https://docs.nestjs.com/websockets/gateways#gateways
*/

import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
  ConnectedSocket,
  GatewayMetadata,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CookieService } from 'src/feature/cookie/cookie.service';
import { WsGuard } from 'src/guards/ws.guard';
import internal from 'stream';
import { ApptrayService } from './apptray.service';
import { UploadFileDTO } from './Dto/uploadFile.dto';

@WebSocketGateway<GatewayMetadata>({
  namespace: 'file-upload',
  cors: {
    origin: [
      'https://cuikapps.com',
      'https://www.cuikapps.com',
      'https://apptray.cuikapps.com',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  },
  allowEIO3: true,
  transports: ['websocket'],
})
export class FileUploadGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly apptray: ApptrayService,
    private readonly cookie: CookieService,
  ) {}

  @WebSocketServer()
  server!: Server;

  writeStreams: Map<string, internal.Writable> = new Map();

  @UseGuards(WsGuard)
  @SubscribeMessage('start-upload')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UploadFileDTO,
  ) {
    try {
      // Get the token value from the cookies
      const uid = (
        this.cookie.getCookie(client.handshake.headers.cookie ?? '', 'token') ??
        ''
      ).split('-')[0];

      await this.apptray.createFile(data, uid);

      return 'Success';
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('continue')
  async handleContinue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UploadFileDTO,
  ) {
    try {
      // Get the token value from the cookies
      const uid = (
        this.cookie.getCookie(client.handshake.headers.cookie ?? '', 'token') ??
        ''
      ).split('-')[0];

      if (this.writeStreams.has(client.id)) {
        const writer = this.writeStreams.get(client.id);
        this.writeStreams.set(
          client.id,
          await this.apptray.continueFileCreation(data, uid, writer),
        );
      } else {
        this.writeStreams.set(
          client.id,
          await this.apptray.continueFileCreation(data, uid),
        );
      }

      return 'Success';
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('end')
  async handleEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UploadFileDTO,
  ) {
    try {
      // Get the token value from the cookies
      const uid = (
        this.cookie.getCookie(client.handshake.headers.cookie ?? '', 'token') ??
        ''
      ).split('-')[0];

      const clientWriter = this.writeStreams.get(client.id);
      if (clientWriter) {
        await this.apptray.finishFileCreation(data, uid, clientWriter);
        this.writeStreams.delete(client.id);
        return 'Success';
      }
      throw new WsException('Failed to find writable stream');
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('User connected: ' + client.id);
  }

  handleDisconnect(client: Socket) {
    const clientWriter = this.writeStreams.get(client.id);
    if (clientWriter) {
      new Promise<void>((resolve, reject) => {
        clientWriter.once('error', (err) => {
          reject(err);
        });
        clientWriter.end(() => {
          resolve();
        });
        clientWriter.destroy();
      }).then(() => {
        this.writeStreams.delete(client.id);
        console.log('User disconnected with upload: ' + client.id);
      });
    } else {
      console.log('User disconnected: ' + client.id);
    }
  }

  afterInit(server: Socket) {
    // console.log(server);
  }
}
