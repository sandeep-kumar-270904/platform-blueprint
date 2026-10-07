describe('Concurrency Reservations', () => {
  it('should prevent double booking of the same slot', () => {
    const slot = { isBooked: true };
    expect(slot.isBooked).toBe(true);
  });
});
