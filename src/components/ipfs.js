

const ipfsClient = require('ipfs-mini');

const ipfs = new ipfsClient({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });


export default ipfs;



//Example upload
/*
captureFile = (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
      
    }
  }


  onSubmit = (event) => {
    event.preventDefault()
    console.log("Submitting file to ipfs...")
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }
      /*this.state.contract.methods.set(result[0].hash).send({ from: this.state.account }).then((r) => {
        return this.setState({ memeHash: result[0].hash })
      })
      this.setState({memeHash:result})
      console.log(this.state.memeHash)
      this.state.contract.methods.set(this.state.memeHash).send({from: this.state.account}).on("confirmation", (r) => {
        this.setState({memeHash: this.state.memeHash});
        //this.setState({memeHash:"File Uploaded Successfully"});
        console.log("File uploaded successfully...");
    });
    })
  }
  */