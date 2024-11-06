import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminCreatorGuard } from '../common/guards/admin-creator.guard';
import { AdminSelfGuard } from '../common/guards/admin-self.guard';
import { AdminSelfForUpdateGuard } from '../common/guards/admin-self-for-update.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @UseGuards(AdminCreatorGuard)
  @Post('create')
  @ApiOperation({
    summary: 'Create admin',
    description: 'Create admin',
  })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all admins',
    description: 'Get all admins',
  })
  @UseGuards(AdminCreatorGuard)
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get admin by id',
    description: 'Get admin by id',
  })
  @UseGuards(AdminSelfGuard)
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update admin by id',
    description: 'Update admin by id',
  })
  @UseGuards(AdminSelfForUpdateGuard)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete admin by id',
    description: 'Delete admin by id',
  })
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
