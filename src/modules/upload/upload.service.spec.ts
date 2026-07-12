import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
        },
    },
}));

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';

const makeConfigServiceMock = (overrides: Record<string, any> = {}) => ({
    get: (key: string) => {
        if (key === 'cloudinary.folder') return overrides['cloudinary.folder'] ?? 'test-folder';
        if (key === 'upload.maxSize') return overrides['upload.maxSize'] ?? 5 * 1024 * 1024;
        return undefined;
    },
});

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    size: 1024,
    originalname: 'test.jpg',
    fieldname: 'file',
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
    ...overrides,
} as unknown as Express.Multer.File);

describe('UploadService', () => {
    let service: UploadService;
    let configService: ReturnType<typeof makeConfigServiceMock>;

    beforeEach(async () => {
        configService = makeConfigServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UploadService,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<UploadService>(UploadService);
        (cloudinary.uploader.upload_stream as jest.Mock).mockReset();
    });

    it('rejects when no file provided', async () => {
        // @ts-ignore
        await expect(service.uploadImage(undefined)).rejects.toThrow(BadRequestException);
    });

    it('rejects when file exceeds max size', async () => {
        const bigFile = makeFile({ size: 10 * 1024 * 1024 });
        await expect(service.uploadImage(bigFile)).rejects.toThrow(BadRequestException);
    });

    it('rejects when mimetype not allowed', async () => {
        const badFile = makeFile({ mimetype: 'application/pdf' });
        await expect(service.uploadImage(badFile)).rejects.toThrow(BadRequestException);
    });

    it('resolves on successful cloudinary upload', async () => {
        const file = makeFile();
        const fakeResult = { secure_url: 'https://cdn/test.jpg', public_id: 'public-id' };

        (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts: any, cb: Function) => {
            // return a writable stream-like object; call callback when "finished"
            cb(null, fakeResult);
            return {
                write: jest.fn(),
                end: jest.fn(),
            } as any;
        });

        await expect(service.uploadImage(file)).resolves.toEqual(fakeResult);
    });

    it('rejects when cloudinary returns error', async () => {
        const file = makeFile();
        const fakeErr = new Error('cloud error');

        (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts: any, cb: Function) => {
            cb(fakeErr, null);
            return {
                write: jest.fn(),
                end: jest.fn(),
            } as any;
        });

        await expect(service.uploadImage(file)).rejects.toThrow(fakeErr);
    });

    it('passes folder and allowed_formats to cloudinary', async () => {
        const file = makeFile();
        const fakeResult = { secure_url: 'https://cdn/test.jpg', public_id: 'public-id' };
        let receivedOpts: any = null;

        (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts: any, cb: Function) => {
            receivedOpts = opts;
            cb(null, fakeResult);
            return {
                write: jest.fn(),
                end: jest.fn(),
            } as any;
        });

        await expect(service.uploadImage(file)).resolves.toEqual(fakeResult);
        expect(receivedOpts).toBeDefined();
        expect(receivedOpts.folder).toBe('test-folder');
        expect(receivedOpts.allowed_formats).toEqual(expect.arrayContaining(['jpg', 'jpeg', 'png', 'webp']));
    });
});
