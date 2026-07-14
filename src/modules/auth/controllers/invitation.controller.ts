import { Controller, Post, Body, UseGuards, Get, Param, Delete, Query, Req } from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../rbac/constants/permissions.constant';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
    constructor(private invitationService: InvitationService) {}

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Post()
    @RequirePermissions(PlatformPermissions.PLATFORM_INVITATIONS_CREATE)
    @ApiOperation({ summary: 'Create a new invitation' })
    @ApiResponse({ status: 201, description: 'Invitation created successfully' })
    async createInvitation(@Body() dto: CreateInvitationDto, @Req() req) {
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

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Get()
    @RequirePermissions(PlatformPermissions.PLATFORM_INVITATIONS_READ)
    @ApiOperation({ summary: 'Get all invitations' })
    @ApiResponse({ status: 200, description: 'List of invitations' })
    async findAll(@Query('email') email?: string) {
        return this.invitationService.findAll({ email });
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Delete(':id')
    @RequirePermissions(PlatformPermissions.PLATFORM_INVITATIONS_DELETE)
    @ApiOperation({ summary: 'Delete an invitation' })
    @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
    async deleteInvitation(@Param('id') id: string) {
        return this.invitationService.deleteInvitation(id);
    }
}
