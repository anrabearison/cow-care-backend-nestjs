import { Controller, Post, Body, UseGuards, Get, Param, Delete, Query, Req } from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '../../platform/users/entities/user.entity';
import { SkipCsrf } from '../decorators/skip-csrf.decorator';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
    constructor(private invitationService: InvitationService) {}

    @UseGuards(JwtAuthGuard)
    @SkipCsrf()
    @Post()
    @ApiOperation({ summary: 'Create a new invitation' })
    @ApiResponse({ status: 201, description: 'Invitation created successfully' })
    async createInvitation(@Body() dto: CreateInvitationDto, @Req() req) {
        const currentUser = req.user;
        return this.invitationService.createInvitation(dto, currentUser);
    }

    @Get('validate/:token')
    @ApiOperation({ summary: 'Validate an invitation token' })
    @ApiResponse({ status: 200, description: 'Invitation is valid' })
    async validateInvitation(@Param('token') token: string) {
        const invitation = await this.invitationService.validateInvitation(token);
        return {
            email: invitation.email,
            role: invitation.role,
            ownerId: invitation.ownerId,
            expiresAt: invitation.expiresAt,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Get all invitations (SUPER_ADMIN and OWNER_ADMIN)' })
    @ApiResponse({ status: 200, description: 'List of invitations' })
    async findAll(@Req() req, @Query('email') email?: string) {
        const currentUser = req.user;
        return this.invitationService.findAll({ email }, currentUser);
    }

    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an invitation (SUPER_ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
    async deleteInvitation(@Param('id') id: string) {
        return this.invitationService.deleteInvitation(id);
    }
}
