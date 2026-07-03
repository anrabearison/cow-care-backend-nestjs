import { IsString, IsDate, IsInt, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PassportStatus } from '../entities/passport.entity';

export class CreatePassportDto {
    @IsString()
    passportNumber: string;

    // Emission information
    @IsString()
    location: string;

    @IsDate()
    issueDate: Date;

    @IsString()
    district: string;

    // Applicant information
    @IsString()
    applicantName: string;

    @IsString()
    cinNumber: string;

    @IsDate()
    cinIssueDate: Date;

    @IsString()
    cinIssueLocation: string;

    // Residence information (legacy fields for backward compatibility)
    @IsString()
    residenceCommune: string;

    @IsString()
    fokontany: string;

    @IsString()
    commune: string;

    @IsString()
    residenceDistrict: string;

    @IsString()
    region: string;

    // Transfer information
    @IsString()
    purchaseCommune: string;

    @IsInt()
    totalCattle: number;

    // Verification information
    @IsDate()
    verificationDate: Date;

    @IsDate()
    arreteDate: Date;

    // Relations
    @IsUUID()
    herdBookId: string;

    @IsOptional()
    @IsEnum(PassportStatus)
    status?: PassportStatus;
}
