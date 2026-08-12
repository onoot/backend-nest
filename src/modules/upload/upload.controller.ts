import { Controller, Post, Get, Param, Query, Req, Res, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class UploadController {
  constructor(private service: UploadService) {}

  @UseGuards(AuthGuard)
  @Post('upload/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    const filename = await this.service.uploadPhoto(file);
    return { filename };
  }

  @UseGuards(AuthGuard)
  @Post('upload/delete')
  async deletePhoto(@Body('filename') filename: string) {
    await this.service.deletePhoto(filename);
  }

  @UseGuards(AuthGuard)
  @Post('uploads/list')
  async listPhotos() {
    const files = await this.service.listPhotos();
    return { files };
  }

  @Public()
  @Get('uploads/*path')
  async serveFile(@Param('path') path: string, @Query('type') type: string | undefined, @Req() req, @Res() res: Response) {
    const actualPath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
    const mode = type === 'thumb' || type === 'full' ? type : undefined;
    const { stream, contentType } = await this.service.getPhoto(actualPath, mode);
    res.set({ 'Content-Type': contentType });
    stream.pipe(res);
  }
}
