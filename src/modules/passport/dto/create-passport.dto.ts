import { IsString, IsInt, IsEnum, IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { PassportStatus } from '../entities/passport.entity';
import { Transform } from 'class-transformer';

export class CreatePassportDto {
    @IsString()
    passportNumber: string;

    // Emission information
    @IsString()
    location: string;

    @IsString()
    issueDate: string;

    @IsString()
    district: string;

    // Applicant information
    @IsString()
    applicantName: string;

    @IsString()
    cinNumber: string;

    @IsString()
    cinIssueDate: string;

    @IsString()
    cinIssueLocation: string;

    // Residence information (legacy fields for backward compatibility)
    @IsString()
    residenceCommune: string;

    @IsString()
    village: string;

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
    @IsString()
    verificationDate: string;

    @IsString()
    arreteDate: string;

    // Relations
    @IsUUID()
    herdBookId: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    })
    cattleIds: string[];

    @IsOptional()
    @IsEnum(PassportStatus)
    status?: PassportStatus;
}
