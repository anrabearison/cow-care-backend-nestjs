export const launch = jest.fn().mockResolvedValue({
  newPage: jest.fn().mockResolvedValue({
    setContent: jest.fn(),
    pdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
    close: jest.fn(),
  }),
  close: jest.fn(),
});
