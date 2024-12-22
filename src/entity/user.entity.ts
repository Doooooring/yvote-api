import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'User',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column()
  platform: string;
}
