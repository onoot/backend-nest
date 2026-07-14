import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandModule } from './modules/brand/brand.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CompanyModule } from './modules/company/company.module';
import { PageModule } from './modules/page/page.module';
import { ProjectModule } from './modules/project/project.module';
import { ReviewModule } from './modules/review/review.module';
import { SliderModule } from './modules/slider/slider.module';
import { LetterModule } from './modules/letter/letter.module';
import { SeoModule } from './modules/seo/seo.module';
import { PageNamesModule } from './modules/page-names/page-names.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { MinioModule } from './modules/minio/minio.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BrandModule,
    CatalogModule,
    CompanyModule,
    PageModule,
    ProjectModule,
    ReviewModule,
    SliderModule,
    LetterModule,
    SeoModule,
    HealthModule,
    PageNamesModule,
    UploadModule,
    MinioModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
