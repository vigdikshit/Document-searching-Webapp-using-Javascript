//-*- mode: rjsx-mode;

'use strict';

const React = require('react');
const Docs = require('./docs.jsx');

class Search extends React.Component {

  /** called with properties:
   *  app: An instance of the overall app.  Note that props.app.ws
   *       will return an instance of the web services wrapper and
   *       props.app.setContentName(name) will set name of document
   *       in content tab to name and switch to content tab.
   */
  constructor(props) {
    super(props);
    //@TODO
      this.sts = false;
      this.err = '';
    this.state = {
      search: '',
      results:[],
      content:[]
    };
    this.getDocs = this.getDocs.bind(this);
  }

  //@TODO

  getTerm(event){
      this.setState({
        search : event.target.value,
          error: ''
      });

  }

    async getDocs(event){
        event.preventDefault();
        this.sts = true;
        let searchTerm = this.state.search;
        let start = this.state.start;
        this.setState({search:searchTerm});
        const docs = await this.props.app.ws.searchDocs(searchTerm, start);
        if(docs.results.length === 0){
            if(!searchTerm.match("[^ ]")){
                this.err = "";
            }
            else {
                this.err = 'No results for ' + searchTerm;
            }
            this.setState({error: this.err});
            this.sts = false;
        }
        this.setState({results: docs.results});

    }

    renderDocs(){
      if(this.sts){
          return <Docs results = {this.state.results} id = {this.state.index}
                       app={this.props.app} search = {this.state.search}/>;
      }
      else{
          return <div><span className="error">{this.state.error}</span></div>;
      }
    }
    render() {
    //@TODO

    return(
        <div>
        <form onSubmit={this.getDocs}>
            <span className="label">Search Terms:</span>
            <span className="control">
            <input onChange={this.getTerm.bind(this)} type="text" name="search"
                                    value = {this.state.search} onBlur={this.getDocs}/>
            </span>
        </form>
            {
                this.renderDocs()
            }
        </div>
    );
  }
}

module.exports = Search;
