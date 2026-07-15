import { Controller, Post, Body, UseGuards, Get, Param, Delete, Query, Req } from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '../../platform/users/entities/user.entity';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
    constructor(private invitationService: InvitationService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a new invitation' })
    @ApiResponse({ status: 201, description: 'Invitation created successfully' })
    async createInvitation(@Body() dto: CreateInvitationDto, @Req() req) {
        const currentUser = req.user;
        
        // OWNER_ADMIN can only create OWNER_USER invitations
        if (currentUser.role === UserRole.OWNER_ADMIN) {
            if (dto.role !== UserRole.OWNER_USER) {
                throw new Error('OWNER_ADMIN can only create OWNER_USER invitations');
            }
            if (!dto.ownerId || dto.ownerId !== currentUser.ownerId) {
                throw new Error('OWNER_ADMIN must specify their own ownerId');
            }
        }
        
        return this.invitationService.createInvitation(dto);
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

    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @Get()
    @ApiOperation({ summary: 'Get all invitations (SUPER_ADMIN only)' })
    @ApiResponse({ status: 200, description: 'List of invitations' })
    async findAll(@Query('email') email?: string) {
        return this.invitationService.findAll({ email });
    }

    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an invitation (SUPER_ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
    async deleteInvitation(@Param('id') id: string) {
        return this.invitationService.deleteInvitation(id);
    }
}
