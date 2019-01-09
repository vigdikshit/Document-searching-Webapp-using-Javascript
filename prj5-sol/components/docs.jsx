'use strict';

const React = require('react');
const Content = require('./content.jsx');
const Tab = require('./tab.jsx');

class Docs extends React.Component{

    constructor(props) {
        super(props);
        this.status = false;
        this.state = {
            docs: this.props.results,
            content: '',
            app: this.props.app,
            search: this.props.search
        };
    }

    getContentTab(name, event){
        this.status = true;
        //const content = await this.props.app.ws.getContent(name);
        this.state.app.setContentName(name);
        event.preventDefault();
    }

    static contentRender(name, status){
        if(status){
            return  <Content name = {name} />;
        }
    }
    wordMatch(lines){
        let arr = [];
        let strLine = [];
        let searchTerm = this.state.search;
        lines = lines.map(function(line){
            //line = line.split(/[^\w\s]/gi);

            for(let w of line){
                let originalW = w;
                w = w.replace(/[^\w\s]/gi,'');
                if(w.toLowerCase() === searchTerm){
                    w = <span className = "search-term">{w}</span>;
                    arr.push(w);
                }
                else{
                    arr.push(originalW);
                }

            }
            strLine = arr;
            arr = [];
            return (
                <span>{strLine}<br/></span>
            )
        });
        return lines;
    }
    render(){
            const docs = this.props.results.map(r => (
                <div className="result">
                    <a className="result-name" key = {r.id} href={r.name}
                       onClick={this.getContentTab.bind(this, r.name)}>
                        {r.name}
                    </a>
                    <br/>
                    <p>
                        {
                           this.wordMatch(r.lines)
                        }
                    </p>
                    {
                        Docs.contentRender(r.name)
                    }
                </div>
            ));
            return <div>{docs}</div>
    }
}

module.exports = Docs;

