import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of users' })
    async findAll(@Query() query, @Req() req, @Res() res: Response) {
        const result = await this.usersService.findAll(query, req.user);

        res.set('Content-Range', `users ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result.data);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific user' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.usersService.findOne(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a user' })
    update(@Param('id') id: string, @Body() updateUserDto: any) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
