import reactLogo from "../../assets/react.svg"
import styles from "./Loading.module.css"

const Loading = () => {
  return (
    <div className={styles.preload}>
      <div className={styles.loaderInner}>
        <span className={styles.loaderLogo}>
          <img src={reactLogo} alt="Loading"/>
        </span>
        <div className={styles.box}></div>
        <div className={styles.box}></div>
        <div className={styles.box}></div>
        <div className={styles.box}></div>
        <div className={styles.box}></div>
      </div>
    </div>
  )
}

export default Loading