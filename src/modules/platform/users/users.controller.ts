import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkipCsrf } from '../../auth/decorators/skip-csrf.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of users' })
    async findAll(@Query() query, @Req() req) {
        return await this.usersService.findAll(query, req.user as User);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific user' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.usersService.findOne(id, req.user as User);
    }

    @SkipCsrf()
    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    create(@Body() createUserDto: CreateUserDto, @Req() req) {
        return this.usersService.create(createUserDto, req.user as User);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a user' })
    update(@Param('id') id: string, @Body() updateUserDto: any, @Req() req) {
        return this.usersService.update(id, updateUserDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate a user (soft delete)' })
    remove(@Param('id') id: string, @Req() req) {
        return this.usersService.remove(id, req.user as User);
    }
}
