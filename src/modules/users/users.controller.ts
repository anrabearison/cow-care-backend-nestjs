import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of users' })
    async findAll(@Query() query, @Req() req, @Res({ passthrough: true }) res: Response) {
        const result = await this.usersService.findAll(query, req.user as User);

        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');

        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific user' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.usersService.findOne(id, req.user as User);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a user' })
    update(@Param('id') id: string, @Body() updateUserDto: any, @Req() req) {
        return this.usersService.update(id, updateUserDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    remove(@Param('id') id: string, @Req() req) {
        return this.usersService.remove(id, req.user as User);
    }
}
