// app/page.js - Direct dashboard redirect, login nahi
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
