import { Controller, Post, Body, UseGuards, Get, Param, Delete, Query } from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/invitation.dto';
import { ValidateInvitationDto } from '../dto/invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
    constructor(private invitationService: InvitationService) {}

    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @Post()
    @ApiOperation({ summary: 'Create a new invitation (SUPER_ADMIN only)' })
    @ApiResponse({ status: 201, description: 'Invitation created successfully' })
    async createInvitation(@Body() dto: CreateInvitationDto) {
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
