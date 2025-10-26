import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='text-center'>
        <LoadingSpinner size='lg' className='mx-auto' />
      </div>
    </div>
  );
}
