import sad404 from '../assets/sad404.svg'

const NotFound = () => {
  return (
    <main className="bg-linear-to-bl from-yellow-300 to-yellow-200 h-screen flex items-center justify-center">
      <div className="flex flex-col items-center text-black font-bold font-sans rtl">
        <img src={sad404} alt="404" className="mb-5 mt-20 h-85.5" />
        <span className="text-[3.3em] font-extrabold mb-10">404 PAGE</span>
        <p className="text-lg mb-3">
          The page you were looking for could not be found
        </p>
        <p className="text-sm mb-6">... Back to previous page</p>
        <a href="#" className="bg-white text-black text-2xl font-extrabold py-2 px-6 rounded-full shadow-[0px_20px_70px_4px_rgba(0,0,0,0.1),inset_7px_33px_0px_#fff300] transition-transform duration-300 hover:-translate-y-3.25 hover:shadow-[0_35px_90px_4px_rgba(0,0,0,0.3),inset_0px_0_0_3px_black]">
          ... Back to previous page
        </a>
      </div>
    </main>
  )
}

export default NotFound